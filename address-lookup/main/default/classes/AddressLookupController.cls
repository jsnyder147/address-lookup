/**
 * @author Jason Snyder
 * @email snyderjm147@gmail.com
 * @description Controller for Address Lookup LWC
 * 				Performs Callout to Google Maps API Place Auto Complete and Details Endpoints
 * @createdDate 4/20/2021
 * @documentation Google Maps API Documentation: https://developers.google.com/maps/documentation/places/web-service/overview
 */
public without sharing class AddressLookupController {
    private static final String CONFIG_NAME = 'Google_Maps_Configuration';
	private static final String RADIUS = '50';

	/**
	 * @description Call out to Google Maps Place Auto Complete endpoint
	 * 				Retrieves suggestions based on input and current location
	 * @method getSuggestions
	 * @param input REQUIRED - Input string to get results for
	 * @param latitude OPTIONAL - Latitude, if using location based search
	 * @param longitude OPTIONAL - Longitude, if using location based search
	 */
    @AuraEnabled
	public static string getSuggestions(String input, String latitude, String longitude) {
	    String url = getEndpoint('Auto_Complete');
	   	url += '?input=' + EncodingUtil.urlEncode(input, 'UTF-8')
	        + '&types=geocode&language=en' + getKey();
		if(latitude != null && longitude != null) {
			url += '&radius=' + RADIUS + '&location=' + latitude + ',' + longitude;
		}
	    String response = getResponse(url);
	    return response;
	}

	/**
	 * @description Callout to Google Maps Place Details endpoint
	 * 				Retrieves details of selected place
	 * @method getPlaceDetails
	 * @param placeId A textual identifier that uniquely identifies a place, returned from a Place Search
	 * @return Place Details, including address data
	 */
    @AuraEnabled
	public static string getPlaceDetails(String placeId) {
     	String url = getEndpoint('Details');
        url += '?placeid=' + EncodingUtil.urlEncode(placeId, 'UTF-8') + getKey(); 
	    String response = getResponse(url);
	    return response;
	}

	/**
	 * @description Retrieves the Google Maps API Endpoint to use from Custom Metadata
	 * @method getEndpoint
	 * @param endpointName The Endpoint name used to retrieve the correct Custom Metadata record
	 * 					   Current Options: Auto_Complete, Details
	 * @return Base Google Maps API endpoint to use in callout
	 */
    private static String getEndpoint(String endpointName) {
        Google_Maps_API_Enpoint__mdt endpointMetadata = [SELECT Id, Endpoint__c FROM Google_Maps_API_Enpoint__mdt WHERE DeveloperName=:endpointName];
        return endpointMetadata.Endpoint__c;
    }
	
	/**
	 * @description Performs Callout to Google Maps API and returns response
	 * @method getResponse
	 * @param endpoint Google Maps API endpoint with query parameters
	 * @return Response from Google Maps API callout
	 */
	public static string getResponse(string endpoint){
		Http http = new Http();
		HttpRequest request = new HttpRequest();
		HttpResponse response = new HttpResponse();
		request.setMethod('GET');
		request.setEndpoint(endpoint);
		request.setTimeout(120000);
		response = http.send(request); 
		String responseBody = response.getBody(); 
		return responseBody;
	}
 
	/**
	 * @description Retrieves the Google Maps API Key from Custom Metadata
	 * @method getKey
	 * @return String paramter with key for Google Maps API
	 */
	public static string getKey(){
        String key;
		Google_Maps_API_Configuration__mdt mapsConfiguration = [SELECT Id, API_Key__c FROM Google_Maps_API_Configuration__mdt WHERE DeveloperName=:CONFIG_NAME];

        key = mapsConfiguration.API_Key__c;

		string output = '&key=' + key;

		return output;
	}
}
