from global_src.global_classes import Community
from routing.api.main import community


@community.route("/<int:community_id>")
async def get_community(community_id: int):
    """Get a community's public information by their community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    return community_get.public_json


@community.route("/<int:community_id>/members")
async def get_community_members(community_id: int):
    """Get a list of members in a community by the community ID"""
    community_get = await Community.get_community(community_id)
    if not community_get:
        return {"error": "Community not found"}, 404
    members = await community_get.get_members()
    return {"members": [i.public_json for i in members]}