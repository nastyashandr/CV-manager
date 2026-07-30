import logging

import requests

from odoo import models, fields
from odoo.exceptions import UserError

_logger = logging.getLogger(__name__)


class CourseProjectImportWizard(models.TransientModel):
    _name = 'course_project.import_wizard'
    _description = 'Import Position from CV Manager'

    backend_url = fields.Char(
        string='Backend URL',
        required=True,
        default='https://cv-manager-zg7l.onrender.com',
    )
    api_token = fields.Char(string='API Token', required=True)

    def action_import(self):
        self.ensure_one()
        base = (self.backend_url or '').rstrip('/')
        if not base:
            raise UserError('Please provide the backend URL.')

        url = f"{base}/api/external/positions/aggregate"

        try:
            response = requests.get(url, params={'token': self.api_token}, timeout=20)
        except requests.RequestException as exc:
            raise UserError(f"Could not reach {url}: {exc}")

        if response.status_code == 401:
            raise UserError('Invalid API token.')
        if response.status_code != 200:
            raise UserError(f"Import failed ({response.status_code}): {response.text[:300]}")

        try:
            data = response.json()
        except ValueError:
            raise UserError('Backend did not return valid JSON.')

        position_data = data.get('position') or {}
        source_id = position_data.get('id')
        if not source_id:
            raise UserError('Response did not contain a position id.')

        Position = self.env['course_project.position']
        position = Position.search(
            [('source_position_id', '=', source_id), ('backend_url', '=', base)],
            limit=1,
        )

        vals = {
            'name': position_data.get('title') or 'Untitled position',
            'short_description': position_data.get('shortDescription') or '',
            'source_position_id': source_id,
            'backend_url': base,
            'api_token': self.api_token,
            'cv_count': data.get('cvCount') or 0,
            'imported_at': fields.Datetime.now(),
        }

        if position:
            position.write(vals)
            position.attribute_ids.unlink()
            position.access_rule_ids.unlink()
        else:
            position = Position.create(vals)

        attribute_lines = []
        for idx, attr in enumerate(data.get('attributes') or []):
            attr_type = attr.get('type') or 'string'
            agg = attr.get('aggregate') or {}
            top_values = agg.get('topValues') or []
            top_values_text = '\n'.join(
                f"{tv.get('value')} — {tv.get('count')}" for tv in top_values
            )

            line_vals = {
                'sequence': idx * 10,
                'name': attr.get('name') or 'Attribute',
                'required': bool(attr.get('required')),
                'type': attr_type,
                'count': agg.get('count') or 0,
                'true_count': agg.get('trueCount') or 0,
                'false_count': agg.get('falseCount') or 0,
                'top_values': top_values_text,
            }

            if attr_type == 'number':
                line_vals['avg_value'] = agg.get('avg') or 0.0
                line_vals['min_value'] = agg.get('min') or 0.0
                line_vals['max_value'] = agg.get('max') or 0.0
            elif attr_type in ('date', 'period'):
                line_vals['min_date'] = str(agg.get('min')) if agg.get('min') else False
                line_vals['max_date'] = str(agg.get('max')) if agg.get('max') else False

            attribute_lines.append((0, 0, line_vals))

        position.write({'attribute_ids': attribute_lines})

        access_rule_lines = []
        for rule in data.get('accessRules') or []:
            value = rule.get('value')
            if isinstance(value, dict):
                value_display = ', '.join(f"{k}: {v}" for k, v in value.items())
            else:
                value_display = str(value) if value is not None else ''
            access_rule_lines.append((0, 0, {
                'attribute_name': rule.get('attributeName') or '',
                'attribute_type': rule.get('attributeType') or '',
                'operator': rule.get('operator') or '',
                'value_display': value_display,
            }))

        position.write({'access_rule_ids': access_rule_lines})

        _logger.info(
            'Imported position %s (%s attributes, %s access rules) from %s',
            position.name, len(attribute_lines), len(access_rule_lines), base,
        )

        return {
            'type': 'ir.actions.act_window',
            'res_model': 'course_project.position',
            'view_mode': 'form',
            'res_id': position.id,
            'target': 'current',
        }
