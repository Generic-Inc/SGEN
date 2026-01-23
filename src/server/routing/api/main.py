from flask import Blueprint
from . import api



@api.route('/ping')
def ping():
    return {"message": "pong!"}