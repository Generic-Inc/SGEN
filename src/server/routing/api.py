from flask import Blueprint

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/ping')
def ping():
    return {"message": "pong!"}