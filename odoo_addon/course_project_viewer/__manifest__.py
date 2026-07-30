{
    'name': 'CV Manager Positions Viewer',
    'version': '17.0.1.0.0',
    'category': 'Human Resources',
    'summary': 'Read-only viewer for aggregated position results imported from the CV Manager course project',
    'description': """
Imports aggregated candidate data from an external CV Manager instance
(position title, the set of attributes used on that position, and an
aggregate result for each attribute) using a per-position API token, and
lets you browse the imported positions and their aggregated results inside Odoo.
""",
    'author': 'Course Project',
    'depends': ['base'],
    'data': [
        'security/ir.model.access.csv',
        'views/course_project_position_views.xml',
        'views/import_wizard_views.xml',
        'views/menu.xml',
    ],
    'application': True,
    'installable': True,
    'license': 'LGPL-3',
}