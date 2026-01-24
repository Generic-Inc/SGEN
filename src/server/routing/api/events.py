from flask import flask, Blueprint, render_template
from main import get_user, get_community, get_user_communities, get_community_members
from global_src.global_classes import Event
from global_src.global_classes import Community
from routing.api.main import community
@community.route('/<int:community_id>/events')
async def get_community_events(community_id: int):
    

