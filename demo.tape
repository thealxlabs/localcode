# LocalCode demo — run with: vhs demo.tape
# Install vhs: brew install charmbracelet/tap/vhs

Output demo.gif
Set FontSize 14
Set Width 900
Set Height 600
Set Theme "Dracula"
Set Framerate 24
Set PlaybackSpeed 0.8

# Start LocalCode
Type "localcode --yes"
Enter
Sleep 2s

# Show the header / wait for load
Sleep 1s

# Ask a question
Type "what files are in this project?"
Enter
Sleep 4s

# Use a slash command
Type "/provider claude"
Enter
Sleep 1s

# Review changes
Type "/review"
Enter
Sleep 5s

# Commit
Type "/commit"
Enter
Sleep 4s

# Ping
Type "/ping"
Enter
Sleep 3s

# Exit
Type "/exit"
Enter
Sleep 1s
