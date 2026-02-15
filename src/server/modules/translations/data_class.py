import os

from dotenv import load_dotenv

from global_src.db import DATABASE
from global_src.global_classes import BaseClass
from google.cloud import translate_v3 as translate

load_dotenv()
project_id = os.getenv('GOOGLE_PROJECT_ID')

class Translator:
    """A translation for a specific language"""

    def __init__(self, languages: list[str]):
        self.client = translate.TranslationServiceAsyncClient()
        self.languages = languages

    async def translate(self, text: str):
        """Translates a single string into all the specified languages, returns a dict of language to translation"""
        translations = {}
        for language in self.languages:
            response = await self.client.translate_text(
                parent=f"projects/{project_id}/locations/global",
                contents=[text],
                mime_type="text/plain",
                target_language_code=language,
            )
            translations[language] = response.translations[0].translated_text
        return translations

    async def translate_and_insert(self, text: str, table: str, column: str, id_column: str, id_value: int):
        """Translates a single string into all the specified languages and inserts them into the database"""
        translations = await self.translate(text)
        for language, translation in translations.items():
            await DATABASE.execute("INSERT INTO Translations (table_name, column_name, record_id, record_column, language, translated_text) VALUES (?,?,?,?,?,?)",
                                   (table, column, id_value, id_column, language, translation), commit=False)
        await DATABASE.commit()

        return translations

    async def get_translated(self, table: str, column: str, id_column: str, id_value: int):
        """Gets a translated string from the database"""
        return await DATABASE.fetch_all("SELECT language, translated_text FROM Translations WHERE table_name=? AND column_name=? AND record_id=? AND record_column=?",
                                  (table, column, id_value, id_column))

TRANSLATOR = Translator(["en", "zh", "ms", "ta"])


if __name__ == "__main__":
    import asyncio


    async def main():
        translator = Translator(["en", "zh", "ms", "ta"])
        translations = await translator.translate("Hello, world!")
        print(translations)


    asyncio.run(main())
