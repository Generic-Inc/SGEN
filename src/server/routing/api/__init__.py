from flask import Blueprint

api = Blueprint('api', __name__, url_prefix='/api')

user_blueprint = Blueprint('user', __name__, url_prefix='/user')
community_blueprint = Blueprint('community', __name__, url_prefix='/community')
auth_blueprint = Blueprint('auth', __name__, url_prefix='/auth')
api.register_blueprint(community_blueprint)
api.register_blueprint(user_blueprint)
user_blueprint.register_blueprint(auth_blueprint)

from . import community
from . import user
from . import main
from . import events
from . import authentication
from . import posts