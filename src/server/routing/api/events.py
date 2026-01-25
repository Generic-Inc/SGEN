from flask import request, render_template
from global_src.global_classes import Community, User
from modules.events import Event, EventAttendance
from . import community_blueprint

@community_blueprint.route("/<int:community_id>/events", methods=["GET", "POST"])
async def community_events(community_id: int):
    """Get all events for a community or create a new event"""
    if not await Community.get_community(community_id):
        return {"error": "Community not found"}, 404

    if request.method == "GET":
        user_id = request.args.get("userId", type=int)
        events = await Event.get_by_community(community_id, user_id)
        return {"events": [e.public_json for e in events]}

    elif request.method == "POST":
        data = request.get_json() or {}
        
        required_fields = ["eventName", "scheduledDate", "eventLocation", "creatorId"]
        if not all(data.get(field) for field in required_fields):
            return {"error": f"Missing required fields: {', '.join(required_fields)}"}, 400

        if not await User.get_user(data.get("creatorId")):
            return {"error": "Creator not found"}, 404

        new_event = await Event.create(
            event_name=data.get("eventName"),
            event_description=data.get("eventDescription"),
            scheduled_date=data.get("scheduledDate"),
            event_location=data.get("eventLocation"),
            community_id=community_id,
            creator_id=data.get("creatorId"),
            image_url=data.get("imageUrl")
        )
        
        if new_event:
            return new_event.public_json, 201
        return {"error": "Failed to create event"}, 500


@community_blueprint.route("/<int:community_id>/events/<int:event_id>", methods=["GET", "PATCH", "DELETE"])
async def single_event(community_id: int, event_id: int):
    """Get, update, or delete a single event"""
    user_id = request.args.get("userId", type=int)
    event = await Event.get_by_id(event_id, user_id)
    
    if not event:
        return {"error": "Event not found"}, 404

    if request.method == "GET":
        return event.public_json

    elif request.method == "PATCH":
        data = request.get_json() or {}
        
        await event.update(
            event_name=data.get("eventName"),
            event_description=data.get("eventDescription"),
            scheduled_date=data.get("scheduledDate"),
            event_location=data.get("eventLocation"),
            image_url=data.get("imageUrl")
        )
        return event.public_json

    elif request.method == "DELETE":
        await event.update(active=0)
        return {"message": "Event deleted successfully"}, 200


@community_blueprint.route("/<int:community_id>/events/<int:event_id>/attendance", methods=["GET", "PUT", "DELETE"])
async def event_attendance(community_id: int, event_id: int):
    """Manage event attendance"""
    event = await Event.get_by_id(event_id)
    if not event:
        return {"error": "Event not found"}, 404

    if request.method == "GET":
        counts = await EventAttendance.get_attendance_counts(event_id)
        status = request.args.get("status")
        if status:
            attendees = await EventAttendance.get_attendees(event_id, status)
            return {
                "counts": counts,
                "attendees": [u.public_json for u in attendees]
            }
        
        return {"counts": counts}

    elif request.method == "PUT":
        data = request.get_json() or {}
        user_id = data.get("userId")
        status = data.get("status", "going")  # Default to 'going'
        
        if not user_id:
            return {"error": "Missing userId"}, 400
        
        if status not in ["going", "interested", "not_going"]:
            return {"error": "Invalid status. Must be: going, interested, or not_going"}, 400

        await EventAttendance.set_attendance(event_id, user_id, status)
        counts = await EventAttendance.get_attendance_counts(event_id)
        
        return {
            "status": status,
            "counts": counts
        }

    elif request.method == "DELETE":
        data = request.get_json() or {}
        user_id = data.get("userId")
        
        if not user_id:
            return {"error": "Missing userId"}, 400

        removed = await EventAttendance.remove_attendance(event_id, user_id)
        
        if removed:
            counts = await EventAttendance.get_attendance_counts(event_id)
            return {"message": "Attendance removed", "counts": counts}
        
        return {"error": "Attendance record not found"}, 404


@community_blueprint.route("/<int:community_id>/events/<int:event_id>/attendees", methods=["GET"])
async def event_attendees(community_id: int, event_id: int):
    """Get list of attendees for an event"""
    event = await Event.get_by_id(event_id)
    if not event:
        return {"error": "Event not found"}, 404

    status = request.args.get("status")  # Optional filter by status
    attendees = await EventAttendance.get_attendees(event_id, status)
    counts = await EventAttendance.get_attendance_counts(event_id)
    
    return {
        "attendees": [u.public_json for u in attendees],
        "counts": counts
    }