from flask import request,render_template
from global_src.global_classes import Community, User, CommunityMember
from modules.authentications import Permissions
from modules.events import Event, EventAttendance
from . import community_blueprint

@community_blueprint.route('<int:community_id>/events', methods=['GET', 'POST'])
async def community_events(community_id: int):...