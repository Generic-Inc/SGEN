from flask import render_template, session, redirect, url_for
from . import pages_blueprint
from global_src.global_classes import Community, User, CommunityMember
from modules.events import Event
from datetime import datetime, timedelta


@pages_blueprint.route('/community/<int:community_id>/events')
async def community_events_page(community_id: int):
    """Render the events page for a community"""

    # Check if user is logged in
    auth_token = session.get('auth_token')
    if not auth_token:
        return redirect(url_for('pages.login'))

    # Get user from token
    user = await User.get_user_by_token(auth_token)
    if not user:
        return redirect(url_for('pages.login'))

    # Get community
    community = await Community.get_community(community_id)
    if not community:
        return "Community not found", 404

    # Check if user is a member
    member = await CommunityMember.get_member(user.user_id, community_id)
    if not member:
        return "You must be a member to view events", 403

    # Get sidebar community
    user_communities = await user.get_communities()

    # Get all events for this community
    events = await Event.get_by_community(community_id, user.user_id)

    # Format events for display
    formatted_events = []
    now = datetime.now()

    for event in events:
        event_data = event.public_json

        # Parse scheduled date
        scheduled_date = datetime.strptime(event_data['scheduledDate'], '%Y-%m-%d %H:%M:%S')
        days_until = (scheduled_date - now).days

        event_data['daysUntil'] = days_until if days_until > 0 else 0
        formatted_events.append(event_data)

    # Sort events by date
    formatted_events.sort(key=lambda x: x['scheduledDate'])

    return render_template(
        'events.html',
        community=community.public_json,
        user=user.public_json,
        user_communities=[c.public_json for c in user_communities],
        events=formatted_events,
        current_date=datetime.now()
    )