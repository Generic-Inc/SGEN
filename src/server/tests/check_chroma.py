import asyncio

from global_src.global_classes import User


async def main():
    user = await User.get_user(2)
    print(user.public_json)
    print(await user.recommended_communities())

asyncio.run(main())