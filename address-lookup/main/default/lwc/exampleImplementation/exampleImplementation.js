import { LightningElement, api, track} from 'lwc';

export default class ExampleImplementation extends LightningElement {
    @track address = {};

    handleUpdateAddress(event) {
        let returnedAddress = event.detail.address;
        if(returnedAddress) {
            let address = {
                street:returnedAddress.street,
                city:returnedAddress.city,
                state:returnedAddress.state,
                postalCode:returnedAddress.postalCode,
                country:returnedAddress.country
            };
            this.address = address;
        }
    }
}