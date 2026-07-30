from odoo import models, fields


class CourseProjectAttribute(models.Model):
    _name = 'course_project.attribute'
    _description = 'Imported Position Attribute Aggregate'
    _order = 'sequence, id'

    position_id = fields.Many2one(
        'course_project.position', string='Position', required=True, ondelete='cascade'
    )
    sequence = fields.Integer(default=10)
    name = fields.Char(string='Attribute', required=True)
    required = fields.Boolean(string='Required on position')
    type = fields.Selection(
        [
            ('string', 'Short text'),
            ('text', 'Long text'),
            ('number', 'Number'),
            ('date', 'Date'),
            ('period', 'Period'),
            ('boolean', 'Yes/No'),
            ('select', 'Select'),
            ('image', 'Image'),
        ],
        string='Type',
        required=True,
    )
    count = fields.Integer(string='Values collected')
    avg_value = fields.Float(string='Average')
    min_value = fields.Float(string='Min')
    max_value = fields.Float(string='Max')
    min_date = fields.Char(string='Earliest')
    max_date = fields.Char(string='Latest')
    true_count = fields.Integer(string='Yes count')
    false_count = fields.Integer(string='No count')
    top_values = fields.Text(string='Most popular values')
    summary = fields.Char(string='Summary', compute='_compute_summary')

    def _compute_summary(self):
        for rec in self:
            if not rec.count:
                rec.summary = 'no data'
            elif rec.type == 'number':
                rec.summary = f"avg {rec.avg_value:g}, min {rec.min_value:g}, max {rec.max_value:g}"
            elif rec.type == 'boolean':
                rec.summary = f"Yes: {rec.true_count}, No: {rec.false_count}"
            elif rec.type in ('date', 'period'):
                rec.summary = f"{rec.min_date or '?'} — {rec.max_date or '?'}"
            elif rec.type in ('string', 'text', 'select'):
                first_line = (rec.top_values or '').split('\n')[0]
                rec.summary = first_line or 'no data'
            else:
                rec.summary = f"{rec.count} value(s)"
