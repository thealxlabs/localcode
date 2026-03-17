Output demo.gif
Set FontSize 14
Set Width 900
Set Height 600
Set Theme "Dracula"
Set Framerate 24
Set PlaybackSpeed 0.8
Set Shell "bash"

# Start LocalCode (--yes skips setup wizard)
Type "localcode --yes"
Enter
Sleep 3s

# Ask about the project
Type "what files are in this project?"
Enter
Sleep 5s

# Switch provider
Type "/provider claude"
Enter
Sleep 1s

# Review changes
Type "/review"
Enter
Sleep 5s

# AI commit
Type "/commit"
Enter
Sleep 4s

# Ping latency
Type "/ping"
Enter
Sleep 3s

# Exit
Type "/exit"
Enter
Sleep 1s
