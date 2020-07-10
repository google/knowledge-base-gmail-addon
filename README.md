**This is not an officially supported Google product. It is a reference implementation.**

# Knowledge Base

This tool is a JavaScript (Angular) and Python solution to showcase an integration between a Gmail add-on and the [Drive API](https://developers.google.com/drive). It saves attachments from selected emails in Gmail to a Drive parent folder. Once the Gmail add-on saves the attachments, the attachments are categorized with a special naming convention. Then a simple Python web application surfaces those categorized attachments via the Drive API.

## Prerequisites

1.  Ensure Python 2.7 is installed.
2.  Download the [Google Cloud SDK](https://cloud.google.com/storage/docs/gsutil_install) for your platform.
3.  Download the [Google App Engine Python SDK](https://cloud.google.com/appengine/downloads) for your platform.
4.  Clone or download this repository to your computer:

        git clone https://github.com/google/knowledge-base-gmail-addon

5.  For App Engine environment, a vendor lock-in is needed for the third-party tools that are used in the application. Run the following command to install those:

        pip install --no-cache-dir --upgrade --quiet --target lib --requirement requirements.txt

This will save a local copy of all the required third-party tools to a `lib` directory.

## Running the application

Now, you can choose to either run this locally for development purposes, or deploy the application to App Engine.

### For development

1.  Use `dev_appserver.py` to run the application locally:

        dev_appserver.py app.yaml

2.  Visit `http://localhost:8080` to view your application.
3.  You can also view the local App Engine dev console by visiting `http://localhost:8000`.

### Deploying to App Engine

1.  Use `gcloud` to deploy the application, you will need to specify your Project ID:

        gcloud app deploy --project=your-project-id

2.  To view your newly deployed application running, you can open a browser with:

        gcloud app browse --project=your-project-id

On first run, you will be prompted for a username and password by HTTP basic auth. The default username is `admin` and password is `admin`.

### Credentials and settings

Once the application is running we can change a few of the defaults that have been set up by the application's initialization.

1. Open a browser and navigate to your newly locally running or App Engine deployed application. Remember, you may be prompted for a username and password by the basic auth scheme. The default username is `admin` and password is `admin`.
2. To view your application's settings page, click the menu icon (three dots) that is located in the top-right corner of the application.

Now that you are on the settings page, you can choose to change the HTTP basic auth username and password if needed. This is recommended. Take note of any changes.

The settings screen also allows us to set a `Client ID` and `config.json` for the application to use as authorization for the Campaign Manager API and Sheets API calls. To gather these credentials:

1. Create a new project in the [Google API Console](https://console.developers.google.com).
2. Click on the `+ ENABLE APIS AND SERVICES` button.
3. Find and enable the `Google Drive API`.
4. Go back to the APIs & Services dashboard and click the `Credentials` tab.
5. Configure a new `OAuth client ID` by clicking the `Create credentials` button.
6. If needed, configure the consent screen.
7. Choose `Web application` and pick a name for your new application.
8. Add your application's local and App Engine URLs to `Authorized JavaScript origins` and `Authorized redirect URIs`.
9. Download the JSON file, open it in a text editor, and copy its contents into the `config.json` field of the settings page.

### Installing the Gmail add-on

Load the code provided in the `add-on` folder into Gmail as an add-on.

#### Setting up the Gmail add-on

Within the Gmail add-on actions menu, go to the Settings action and set the following:

Parent Folder ID

```
xxxxxxxxxxxxxxxxxxxxxxx-xxxxxxxxx
```

Filters JSON

```
{
  "Product" : ["Display & Video 360", "Campaign Manager", "Search Ads 360", "Google Analytics", "Studio"],
  "Type": ["Runbook", "Release Notes", "Help Center"]
}
```

## Additional resources

Information on App Engine:

> https://cloud.google.com/appengine

Python on App Engine:

> https://cloud.google.com/appengine/docs/python

Running a local server for App Engine applications:

> https://cloud.google.com/appengine/docs/standard/python/tools/using-local-server

## Authors

- Tony Coconate (coconate@google.com) – Google
