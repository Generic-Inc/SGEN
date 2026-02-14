from dotenv import load_dotenv

from global_src.db import DATABASE


class Onboarding:
    def __init__(self, user_id: int,
                 age: int,
                 interests: str,
                 pronouns: str=None,
                 region: str=None):
        self.user_id = user_id
        self.age = age
        self.interests = interests
        self.pronouns = pronouns
        self.region = region

    @property
    def public_json(self):
        return {
            "userId": self.user_id,
            "age": self.age,
            "interests": self.interests,
            "pronouns": self.pronouns,
            "region": self.region
        }

    @classmethod
    async def register_onboarding(cls, user_id: int, age: int, interests: str, pronouns: str=None, region: str=None) -> bool:
        """Registers the onboarding information for a user, returns True if successful, False otherwise"""
        try:
            await DATABASE.execute("""
                INSERT INTO OnboardingInformation (user_id, age, interests, pronouns, region)
                VALUES (?, ?, ?, ?, ?)
            """, (user_id, age, interests, pronouns, region))
            return True
        except Exception as e:
            print(f"Error registering onboarding: {e}")
            return False

    @classmethod
    async def get_onboarding(cls, user_id: int) -> "Onboarding":
        data = await DATABASE.execute("""
            SELECT age, interests, pronouns, region
            FROM OnboardingInformation
            WHERE user_id = ?
        """, (user_id,))
        if not data:
            return None
        age, interests, pronouns, region = data[0]
        return cls(user_id, age, interests, pronouns, region)
