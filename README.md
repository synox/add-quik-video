> CLI to add videos to the GoPro Quik Desktop for Mac app. 

This is not an official GoPro product, and is not affiliated with, or sponsored or endorsed by, GoPro.

# Why?
So simplify adding files to Quik. 

# Caveats
- Only works on MacOs
- The application has to be restarted for the files to be visible. 
- Thumbnails are not displayed in Media View
- !! It may break your GoPro Quik Database and you might not be able to open Quik any more. 
# Usage

npx add-quik-video IMG_1337.mp4

# Q&A

### Can I Add 3rd Party Videos/Photos in Quik for desktop?
Yes, you can with this tool. 

### How does it work?
It adds the file directly into the Quik database. 

### Is it safe to use?
Not really. You might lose your files or creations. Use at your own risk.

 ### Quik does not start any more. What can I do?
Force-Quit Quik and delete the file: 

    /Users/#USER#/Library/Application Support/com.GoPro.goproapp.GoProMediaService/Databases/media.db
    
You lose all your progress. 

