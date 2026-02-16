from flask import Blueprint
from . import api, search_blueprint


@api.route('/ping')
def ping():
    return {"message": "pong!"}

@api.route("/search")
async def search():
    return {"option": [{"name": "event:test", "href": "community/1/event/1"}, {"name": "community:test", "href": "community/1"}]}