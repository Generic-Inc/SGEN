from flask import Blueprint

pages_blueprint = Blueprint('pages', __name__)
pages_community_blueprint = Blueprint('pages_community', __name__)
pages_blueprint.register_blueprint(pages_community_blueprint, url_prefix='/community')

from . import pages
from . import events
from . import communities