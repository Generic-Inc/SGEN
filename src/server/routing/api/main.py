from flask import Blueprint, request

from global_src.db import DATABASE
from . import api


@api.route('/ping')
def ping():
    return {"message": "pong!"}

@api.route("/search", methods=["GET", "POST"])
async def search():
    if request.method == "GET":
        community_get = await DATABASE.fetch_all(
            "SELECT community_id, display_name FROM communities LIMIT 3")
        events_get = await DATABASE.fetch_all("SELECT event_id, event_name FROM events LIMIT 3")
        users_get = await DATABASE.fetch_all(
            "SELECT user_id, display_name FROM Profiles LIMIT 3",)
        return {"results": [{"name": f"community:{i[1]}", "href": f"community/{i[0]}"} for i in community_get] +
                           [{"name": f"event:{i[1]}", "href": f"community/1/event/{i[0]}"} for i in events_get] +
                           [{"name": f"user:{i[1]}", "href": f"user/{i[0]}"} for i in users_get]
                }
    elif request.method == "POST":
        data = request.json
        query = data.get("content", "")
        community_get = await DATABASE.fetch_all("SELECT community_id, display_name FROM communities WHERE display_name LIKE ? LIMIT 3", (f"%{query}%",))
        events_get = await DATABASE.fetch_all("SELECT event_id, event_name FROM events WHERE event_name LIKE ? LIMIT 3", (f"%{query}%",))
        users_get = await DATABASE.fetch_all("SELECT user_id, display_name FROM Profiles WHERE display_name LIKE ? LIMIT 3", (f"%{query}%",))
        return {"results": [{"name": f"community:{i[1]}", "href": f"community/{i[0]}"} for i in community_get] +
                           [{"name": f"event:{i[1]}", "href": f"community/1/event/{i[0]}"} for i in events_get] +
        [{"name": f"user:{i[1]}", "href": f"user/{i[0]}"} for i in users_get]
                }