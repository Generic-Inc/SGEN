from flask import Blueprint

from global_src.global_classes import User
from global_src.global_classes import Community
api = Blueprint('api', __name__, url_prefix='/api')

user = Blueprint('user', __name__, url_prefix='/user')
community = Blueprint('community', __name__, url_prefix='/community')
api.register_blueprint(user)
api.register_blueprint(community)


@api.route('/ping')
def ping():
    return {"message": "pong!"}