from flask import Blueprint

pages_blueprint = Blueprint('pages', __name__,
                           template_folder='../../../client/templates',
                           static_folder='../../../client/static')

from . import events

__all__ = ['pages_blueprint']