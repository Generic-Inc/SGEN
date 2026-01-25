from flask import Blueprint

api = Blueprint('api', __name__, url_prefix='/api')

user_blueprint = Blueprint('user', __name__, url_prefix='/user')
community_blueprint = Blueprint('community', __name__, url_prefix='/community')
chat_blueprint = Blueprint('chat', __name__)
api.register_blueprint(user_blueprint)
api.register_blueprint(community_blueprint)
api.register_blueprint(chat_blueprint)



from . import community
from . import user
from . import main
from . import chat