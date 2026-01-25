from flask import Flask
import sys
from pathlib import Path

from routing.api import api

app = Flask(__name__)
app.json.sort_keys = False

from routing.api.main import api
app.register_blueprint(api)

@app.route('/')
def test():
    return "yep, the root route works!"


if __name__ == '__main__':
    import subprocess
    subprocess.run(["flask", "run"])