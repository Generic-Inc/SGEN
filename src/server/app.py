from flask import Flask

from routing.api.main import api

app = Flask(__name__)
app.json.sort_keys = False
app.register_blueprint(api)

@app.route('/')
def test():
    return "yep, the root route works!"

if __name__ == '__main__':
    import subprocess
    subprocess.run(["flask", "run"])