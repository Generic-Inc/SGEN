from flask import flask, Blueprint, render_template
from main import get_user, get_community, get_user_communities, get_community_members
@flask.route('/<int:community_id>/events')
async def get_community_events(community_id: int):...
