@echo off
echo ========================================================
echo        PrepSense AI - 1-Click GitHub Pusher
echo ========================================================
echo.
echo Make sure you have created the empty repository on GitHub:
echo https://github.com/new  (Name: prepsense-ai)
echo.
pause
echo Pushing branch 'main' to https://github.com/BhumikaSR9/prepsense-ai.git ...
git push -u origin main
echo.
if %errorlevel% equ 0 (
    echo ========================================================
    echo SUCCESS! Your code is now live on GitHub!
    echo Next step: Deploy with Render.com in 1-Click:
    echo 1. Open: https://dashboard.render.com
    echo 2. Click "New +" -^> "Web Service"
    echo 3. Connect "BhumikaSR9/prepsense-ai"
    echo 4. Set GEMINI_API_KEY environment variable
    echo 5. Click "Create Web Service"
    echo ========================================================
    start https://dashboard.render.com
) else (
    echo.
    echo If GitHub asks for login or personal access token, please sign in.
    echo If repository was not found, create it at: https://github.com/new
)
echo.
pause
