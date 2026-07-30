from odoo import models, fields


class CourseProjectAccessRule(models.Model):
    _name = 'course_project.access_rule'
    _description = 'Imported Position Access Rule'
    _order = 'id'

    position_id = fields.Many2one(
        'course_project.position', string='Position', required=True, ondelete='cascade'
    )
    attribute_name = fields.Char(string='Attribute')
    attribute_type = fields.Char(string='Type')
    operator = fields.Char(string='Operator')
    value_display = fields.Char(string='Value')
