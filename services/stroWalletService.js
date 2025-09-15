require("dotenv").config();
const axios = require("axios");

// Verify Transaction Session ID
exports.verifySessionId = async (amount, sessionID) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;

  const url = "https://strowallet.com/api/verifysessionid/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      amount,
      sessionID,
    },
  });

  return response.data;
};

// Verify BVN
exports.verifyBVN = async ({
  number,
  firstName,
  lastName,
  dateOfBirth,
  phoneNumber,
  mode,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyc_bvn/";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        accept: "application/json",
      },
      params: {
        public_key: STRO_PUB_KEY,
        number,
        firstName,
        lastName,
        dateOfBirth,
        phoneNumber,
        mode,
      },
    }
  );

  return response.data;
};

// Confirm BVN
exports.confirmBVN = async ({ trx, otp, mode }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyc_bvnotp/";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        accept: "application/json",
      },
      params: {
        public_key: STRO_PUB_KEY,
        trx,
        otp,
      },
    }
  );
  return response.data;
};

// Verify NIN
exports.verifyNIN = async ({
  number_nin,
  surname,
  firstname,
  birthdate,
  telephoneno,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyc_verinin/";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        accept: "application/json",
      },
      params: {
        public_key: STRO_PUB_KEY,
        number_nin,
        surname,
        firstname,
        birthdate,
        telephoneno,
      },
    }
  );

  return response.data;
};

// Get Data Plans
exports.getDataPlans = async ({ service_name }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/buydata/plans/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      service_name,
    },
  });

  return response.data;
};

// Purchase Data
exports.purchaseData = async ({
  amount,
  phone,
  service_name,
  service_id,
  variation_code,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/buydata/request/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      amount,
      phone,
      service_name,
      service_id,
      variation_code,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Purchase Airtime
exports.purchaseAirtime = async ({ amount, phone, service_name }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/buyairtime/request/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      amount,
      phone,
      service_name,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Get CableTV Plans
exports.getCableTVPlans = async ({ service_id }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/cable-subscription/plans/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      service_id,
    },
  });

  return response.data;
};

// Verify SmartCard Number
exports.verifySmartCardNo = async ({ service_id, customer_id }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/cable-subscription/verify-merchant/";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        accept: "application/json",
      },
      params: {
        public_key: STRO_PUB_KEY,
        service_id,
        customer_id,
      },
    }
  );

  return response.data;
};

// Subscribe CableTV Plans
exports.subscribeCableTv = async ({
  amount,
  phone,
  service_name,
  service_id,
  variation_code,
  customer_id,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/cable-subscription/request/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      amount,
      phone,
      service_name,
      service_id,
      variation_code,
      customer_id,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Verify Meter Number
exports.verifyMeterNo = async ({ service_name, meter_type, meter_number }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/electricity/verify-merchant/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      service_name,
      meter_type,
      meter_number,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Purchase Electricity
exports.subscribeElectricity = async ({
  amount,
  phone,
  service_name,
  meter_type,
  meter_number,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/electricity/request/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      amount,
      phone,
      service_name,
      meter_type,
      meter_number,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Create Virtual USD Card
exports.createVirtualUSDCard = async ({
  name_on_card,
  card_type,
  amount,
  customerEmail,
  mode,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/bitvcard/create-card/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      name_on_card,
      card_type,
      amount,
      customerEmail,
      mode,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

exports.exchangeRate = async () => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/exchange-rate/USD/NGN/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
    },
  });

  return response.data;
};

// Fund Virtual USD Card
exports.fundVirtualUSDCard = async ({ card_id, amount, mode }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/bitvcard/fund-card/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      card_id,
      amount,
      mode,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

// Withdraw Funds from Virtual USD Card
exports.withdrawFromVirtualUSDCard = async ({ card_id, amount, mode }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/bitvcard/card_withdraw/";

  const response = await axios.post(
    url,
    {},
    {
      headers: {
        accept: "application/json",
      },
      params: {
        public_key: STRO_PUB_KEY,
        card_id,
        amount,
        mode,
      },
    }
  );

  return response.data;
};

// Get Card Transactions
exports.getCardTransactions = async ({ card_id, mode }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/bitvcard/card-transactions/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      card_id,
      mode,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

exports.getCardDetails = async ({ card_id, mode }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/bitvcard/fetch-card-detail/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      card_id,
      mode,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

exports.createUSDTAddress = async ({ label, webhook_url, mode, vip_key }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/generate-address/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      label,
      webhook_url,
      mode,
      vip_key,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};

exports.getReceiverAcctName = async ({ bank_code, account_number }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/banks/get-customer-name/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      bank_code,
      account_number,
    },
  });

  return response.data;
};

exports.getNINDetails = async ({ number_nin }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyc_getnin/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      number_nin,
    },
  });

  return response.data;
};

exports.getBVNDetails = async ({ number }) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyc_getbvn/";

  const response = await axios.get(url, {
    headers: {
      accept: "application/json",
    },
    params: {
      public_key: STRO_PUB_KEY,
      number,
    },
  });

  return response.data;
};

exports.verifyCAC = async ({
  rc_number,
  company_type,
  entity_type,
  company_name,
  surname,
  firstname,
  email,
  phoneNumber,
  gender,
  city,
  occupation,
}) => {
  const STRO_PUB_KEY = process.env.STROWALLET_PUBLIC_KEY;
  const url = "https://strowallet.com/api/kyb_cac/";

  const response = await axios.post(
    url,
    {
      public_key: STRO_PUB_KEY,
      rc_number,
      company_type,
      entity_type,
      company_name,
      surname,
      firstname,
      email,
      phoneNumber,
      gender,
      city,
      occupation,
    },
    {
      headers: {
        accept: "application/json",
      },
    }
  );

  return response.data;
};
