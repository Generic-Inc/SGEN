from flask import Blueprint

api = Blueprint('api', __name__)
auth_blueprint = Blueprint('auth', __name__)
community_blueprint = Blueprint('community', __name__)
chat_blueprint = Blueprint('chat', __name__)
user_blueprint = Blueprint('user', __name__)

api.register_blueprint(auth_blueprint, url_prefix='/auth')
api.register_blueprint(community_blueprint, url_prefix='/community')
api.register_blueprint(chat_blueprint)
api.register_blueprint(user_blueprint, url_prefix='/user')
from . import main
from . import authentication
from . import user
from . import community
from . import chat
from . import posts
from . import events