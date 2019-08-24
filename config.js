/**
 * 
 * Create and export environment variables
 * 
 */


 //Container for all environments
 let environments = {};

//Staging environment
 environments.staging = {
     'httpPort' : 3000,
     'httpsPort' : 3001,
     'envName' : 'staging'
 };

//Production environment
 environments.production = {
     'httpPort' : 5000,
     'httpsPort' : 5001,
     'envName' :  'production'
 };

 //Determine which variable to export based on a command line argument
 let currentEnvironment =  typeof(process.env.NODE_ENV) == 'string' ? process.env.NODE_ENV.toLowerCase() : '';

 //Check the current environment is one of the environments given above, else default to staging
 let environmentToExport = typeof(environments[currentEnvironment]) == 'object'? environments[currentEnvironment] : environments.staging;

 //Export the environment 
 module.exports = environmentToExport;