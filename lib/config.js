module.exports = {

    USA : {
		production: {
            host_name : 'twonetprod.qualcomm.com',
            url_path : 'cuc/rest/',
            customer_id : 'YOUR CUSTOMER ID',
            auth_key : 'YOUR AUTH KEY'
		},
        sandbox : {
            host_name : 'twonet-int-gateway.qualcomm.com',
            url_path  : 'demo3/cuc/rest/',
            customer_id : 'YOUR CUSTOMER ID',
            auth_key : 'YOUR AUTH KEY'
        }
    },

    EU : {
		production: {
            host_name : 'twonet.qualcommlife.com',
            url_path : 'cuc/rest/',
            customer_id : 'YOUR CUSTOMER ID',
            auth_key : 'YOUR AUTH KEY'
		}
    },

	FR : {
		production : {
            host_name : 'twonetprodfr.qualcommlife.com',
            url_path : 'cuc/rest/',
            customer_id : 'YOUR CUSTOMER ID',
            auth_key : 'YOUR AUTH KEY'
		}
	}

};