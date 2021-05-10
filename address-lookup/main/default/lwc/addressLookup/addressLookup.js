import { LightningElement, track } from 'lwc';
import getSuggestions from '@salesforce/apex/AddressLookupController.getSuggestions';
import getPlaceDetails from '@salesforce/apex/AddressLookupController.getPlaceDetails';
import PROMPT from '@salesforce/label/c.Google_Address_Input_Prompt';
const ADDRESS_SELECTED_EVENT = 'addressselected';
export default class AddressLookup extends LightningElement {
    currentLocation = {latitude:null, longitude:null}
    noPredictions = false;
    prompt = PROMPT;

    @track predictions = null;

    connectedCallback() {
        this.getLocation();
    }
    
    /**
     * @description Retrieves current geolocation data from Navigator API
     * @funciton getLocation
     */
    getLocation() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(position => {
                this.currentLocation={latitude:position.coords.latitude,longitude:position.coords.longitude};
                console.log('currentLocation', JSON.parse(JSON.stringify(this.currentLocation)));
            });
        }
    }

    /**
     * @description onblur event handler for address-input input
     *              Hides search results container on blur
     * @funciton handleBlur
     */
    handleBlur(event) {
        let searchResultsContainer = this.template.querySelector('[data-id="search-results"]');
        searchResultsContainer.classList.remove('is-open');
    }

    /**
     * @description onclick event handler for address-input input
     *              If input has already been used and there are predictions to display, displays search results container
     * @funciton handleInputClick
     */
    handleInputClick(event) {
        if(this.predictions && this.predictions.length > 0) {
            let searchResultsContainer = this.template.querySelector('[data-id="search-results"]');
            searchResultsContainer.classList.add('is-open');
        }
    }

    /**
     * @description onmouseover event handler for search-result-item div
     *              When search results are returned, the first item in the list is focused
     *              When user hovers over an item for the first time the default focus is removed,
     *              and standard css hover property is used for focusing
     * @funciton handleResultHover
     */
    handleResultHover(event) {
        let searchResultItems = this.template.querySelectorAll('.search-result-item');
        if(searchResultItems && searchResultItems.length > 0) {
            searchResultItems.forEach(searchResultItem => {
                searchResultItem.classList.remove('focused');
            });
        }
    }

    /**
     * @description onmousedown event handler for search-result-item div
     *              Retrieves the key (placeId) from the selected search-result-item div
     * @funciton handleResultClick
     */
    handleResultClick(event) {
        console.log(event.currentTarget.dataset.id)
        let key = event.currentTarget.dataset.id;
        this.getDetail(key);
    }

    /**
     * @description onkeyup event handler for address-input input
     *              retrieves the value from the input
     * @funciton handleSearch
     */
    handleSearch(event) {
        console.log(event.target.value);
        let value = event.target.value;
        // Value has been removed, set predictions to null and hide search results container
        if(value == '' || value == null || value == undefined) {
            this.predictions = null;
            this.handleBlur();
        }
        // Value has been entered, get predictions
        else {
            this.search(value);
        }
       
    }

    /**
     * @description Call to Apex to get predictions based on input value
     * @funciton search
     * @param value Value from address-input input
     */
    search(value) {
        getSuggestions({
            input:value,
            latitude:this.currentLocation.latitude,
            longitude:this.currentLocation.longitude
        })
        .then(data => {
            if(data) {
                data = JSON.parse(data);
                console.log(data);
                // Value has predictions to display
                if(data.predictions && data.predictions.length > 0) {
                    try {
                        this.predictions = this.getPredictions(data.predictions);
                        console.log('Predictions', JSON.parse(JSON.stringify(this.predictions)));
                        this.insertPredictions(this.predictions);
                    }
                    catch(error) {
                        console.error(error);
                    }
                }
                // No predictions returned from callout
                else {
                    this.noPredictions = true;
                }
            }
        })
        .catch(error => {
            console.error(error);
        });
    }

    /**
     * @description Call to apex to retrieve details for selected prediction
     * @funciton getDetail
     * @param key A textual identifier that uniquely identifies a place, returned from a Place Search (placeId)
     */
    getDetail(key) {
        getPlaceDetails({
            placeId:key
        })
        .then(data => {
            data = JSON.parse(data);
            console.log('data', data);
            if(data && data.result) {
                let addressDetail = this.getAddressDetail(data.result.address_components);
                console.log('addressDetail:', addressDetail);
                this.notifyAddressSelected(addressDetail);
            }
            else {
                console.warn('Place Details Data == null');
            }
        })
        .catch(error => {
            console.error(error);
        });
    }

    /**
     * @description Builds an object containing the main address fields
     * @funciton getAddressDetail
     * @param addressComponents An array containing the separate components applicable to the retreived address
     * @return Object containing address fields: 
     *         streetNumber, route, street, city, state, country, postalCode, postalCodeSuffix
     */
    getAddressDetail(addressComponents) {
        if(addressComponents && addressComponents.length > 0) {
            let addressDetail = {};
            // Loop through each Address Component
            addressComponents.forEach(addressComponent => {
                if(addressComponent.types && addressComponent.types.length > 0) {
                    // Loop though each Address Component Type
                    addressComponent.types.forEach(type => {
                        switch(type) {   
                            case 'street_number':
                                addressDetail.streetNumber = addressComponent.long_name;
                                break;
                            case 'route':
                                addressDetail.route = addressComponent.long_name;
                                break;
                            case 'locality':
                                addressDetail.city = addressComponent.long_name;
                                break;
                            case 'sublocality_level_1': {
                                addressDetail.city = addressComponent.long_name;
                            }
                            case 'administrative_area_level_1':
                                addressDetail.state = addressComponent.short_name;
                                break;
                            case 'country':
                                addressDetail.country = addressComponent.long_name;
                                break;
                            case 'postal_code':
                                addressDetail.postalCode = addressComponent.long_name;
                                break;
                            case 'postal_code_suffix':
                                addressDetail.postalCodeSuffix = addressComponent.long_name;
                        }
                    });
                }
                else {
                    console.warn('Address Component Type == null or Empty List');
                }
            });
            
            return this.cleanUpAddress(addressDetail);
        }
        else {
            console.warn('Address Components null or Empty List');
            return null;
        }
    }

    /**
     * @description Based on results from callout, some street values do not have both the street number and route
     *              Provides the correct value for street based on available address components
     *              Also, if there is a postalCodeSuffix, concatonates the suffix to the end of the postalCode field
     * @funciton cleanUpAddress
     * @param addressDetail Object containing address fields: 
                            streetNumber, route, city, state, country, postalCode, postalCodeSuffix
     * @return Object containing address fields, with addtional field for street, and concatonated postalCode field
     */
    cleanUpAddress(addressDetail) {
        // Set Street
        addressDetail.street = '';
        // Both Street Number and Route
        if(addressDetail.streetNumber && addressDetail.route) {
            addressDetail.street = `${addressDetail.streetNumber} ${addressDetail.route}`;
        }
        // Only Street Number
        else if(addressDetail.streetNumber){
            addressDetail.street += addressDetail.streetNumber;
        }
        // Only Route
        else if(addressDetail.route) {
            addressDetail.street += addressDetail.route;
        }
        // Add Postal Code Suffix if available
        if(addressDetail.postalCodeSuffix) {
            addressDetail.postalCode = `${addressDetail.postalCode}-${addressDetail.postalCodeSuffix}`;
        }

        return addressDetail;
    }

    /**
     * @description Builds a list of Prediction objects to display to the user
     * @funciton getPredictions
     * @param returnedPredictions Array of prediction objects returned from callout
     * @return List of Prediction objects formated for display
     *         Fields: mainTextMatchedSubstrings, mainText, secondaryText, key
     */
    getPredictions(returnedPredictions) {
        let predictions = [];
        returnedPredictions.forEach(returnedPrediction => {
            console.log(returnedPrediction.description)
            // Only provide 5 predictions at a time
            if(predictions.length < 5) {
                predictions.push({
                    mainTextMatchedSubstrings:returnedPrediction.structured_formatting.main_text_matched_substrings,
                    mainText:returnedPrediction.structured_formatting.main_text, 
                    secondaryText:returnedPrediction.structured_formatting.secondary_text, 
                    key:returnedPrediction.place_id
                });
            }
           
        });
        return predictions;
    }

    /**
     * @description Inserts the predictions in the UI and displays the search results container
     * @funciton insertPredictions
     * @param predictions List of Prediction objects formated for display
     */
    insertPredictions(predictions) {
        // Timeout for template to load
        setTimeout(() => {
            this.setMainText(predictions);
            this.setFocused();
            let searchResultsContainer = this.template.querySelector('[data-id="search-results"]');
            searchResultsContainer.classList.add('is-open');
        }, 100);
    }

    /**
     * @description Inserts the first line of the prediction in the UI
     * @funciton setMainText
     * @param predictions List of Prediction objects formated for display
     */
    setMainText(predictions) {
        let searchResultItems = this.template.querySelectorAll('.result-line-one');
        if(searchResultItems && searchResultItems.length > 0) {
            searchResultItems.forEach(searchResultItem => {
                let thePrediction = predictions.find(prediction => prediction.key == searchResultItem.dataset.key);
                let mainTextHTML = this.getMainTextHTML(thePrediction);
                searchResultItem.innerHTML = mainTextHTML;
            });
        }
    }  

    /**
     * @description Sets the first prediction returned to focused (highlighted)
     * @funciton setFocused
     */
    setFocused() {
        let searchResultsContainer = this.template.querySelector('[data-id="search-results"]');
        searchResultsContainer.firstElementChild.classList.add('focused');
    }

    /**
     * @description Sets the value for the first line of a search result
     *              The value that was searched for should be bold on each search result
     * @funciton getMainTextHTML
     */
    getMainTextHTML(prediction) {
        let mainText = prediction.mainText;
        if(prediction.mainTextMatchedSubstrings && prediction.mainTextMatchedSubstrings.length > 0) {
            // Loop through matched Substrings (Input strings that are in the returned prediction)
            prediction.mainTextMatchedSubstrings.forEach(matchedSubstring => {
                let substring = prediction.mainText.substring(matchedSubstring.offset, matchedSubstring.offset + matchedSubstring.length);
                mainText = mainText.replace(substring, `<strong>${substring}</strong>`);
            })
        }
        return mainText
    }

    /**
     * @description Dispatch addressselected event to parent component notifying that an address has been selected
     *              Returns the addressDetail Object with fields:
     *              streetNumber, route, street, city, state, country, postalCode, postalCodeSuffix
     * @funciton notifyAddressSelected
     */
    notifyAddressSelected(addressDetail) {
        if(addressDetail) {
            this.dispatchEvent(new CustomEvent(ADDRESS_SELECTED_EVENT, {detail:{address:addressDetail}}));
        }
        else {
            console.warn('Address Detail == null');
        }
    }
}