import os
from flask import Flask, render_template
from routing.api import api

base_dir = os.path.dirname(os.path.abspath(__file__))
client_folder = os.path.join(base_dir, "..", "client")

app = Flask(__name__,
            template_folder=os.path.join(client_folder, "templates"),
            static_folder=os.path.join(client_folder, "static"))

app.json.sort_keys = False
app.register_blueprint(api, url_prefix='/api')

@app.route('/')
async def index():
    return render_template('index.html')

if __name__ == '__main__':
    app.run(debug=True)