from odoo import models, fields


class CourseProjectPosition(models.Model):
    _name = 'course_project.position'
    _description = 'Imported Position (CV Manager)'
    _order = 'imported_at desc'

    name = fields.Char(string='Title', required=True)
    short_description = fields.Text(string='Description')
    source_position_id = fields.Char(string='Source Position ID', required=True, index=True)
    backend_url = fields.Char(string='Backend URL')
    api_token = fields.Char(string='API Token')
    cv_count = fields.Integer(string='Published CVs used')
    imported_at = fields.Datetime(string='Imported At')
    attribute_ids = fields.One2many(
        'course_project.attribute', 'position_id', string='Attributes'
    )
    attribute_count = fields.Integer(
        string='Attributes', compute='_compute_attribute_count'
    )

    _sql_constraints = [
        (
            'source_position_backend_unique',
            'unique(source_position_id, backend_url)',
            'This position has already been imported from this backend.',
        )
    ]

    def _compute_attribute_count(self):
        for rec in self:
            rec.attribute_count = len(rec.attribute_ids)

    def action_reimport(self):
        self.ensure_one()
        wizard = self.env['course_project.import_wizard'].create({
            'backend_url': self.backend_url,
            'api_token': self.api_token,
        })
        return {
            'type': 'ir.actions.act_window',
            'name': 'Import Position',
            'res_model': 'course_project.import_wizard',
            'view_mode': 'form',
            'res_id': wizard.id,
            'target': 'new',
        }