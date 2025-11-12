"# api-tasks" 


There are 2 files. 

1) run.js
  Main Code.
  First, it calls the Domo/authentication api and retrieves and access_token.
  Second, using the access_token, it gets a list of datasets
  Third, loops there the datasets, extracts the relevent data
  Forth, combines all the data into a .csv file



3) schedule.yml
   This is a scheduler file. It defines what is going to be ran. Also establishes any environment variables that is needed to run run.js.
