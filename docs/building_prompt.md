I want to create a marketplace for green energy trading and information.

users should be able to subscribe. there will be 2 subscriptions.

- 7 days trial where users will be able to watch news and view only offers for buying and selling.
- standard subscription where users will have access to live news and also be able buy and sell green energy.

the platform will have 2 sections. live news and the marketplace.
We are energy brokers and we want to allow people to trade
EUAs, EUA2 GOO, GEO, voluntary markets, bio fuels

users need to see headline news for these industries
users need to view live prices for these products and also to be able to sell their own EUAs and buy EUAs if needed.
our system should also get EUA prices and place offers to sell those at configurable units lower than their current price

when a user places an offer to buy or sell we should get a notification (admins should get notifications on email, sms and maybe more)

sites should be responsive
there should user authentication, admin roles and permissions

I think we will need a landing page, the app that the news and the trading will occur and an admin app. (any other ideas are welcome)
users in order to buy/sell european assets should pass KYC

in order to buy/sell something there should be a form where users should place the quantity and the desired price. when they will be selecting which products to buy/sell we should show them current avaialble offers

Need to create the product requirement document,
the architecture and proper project management plan with weekly sprints

there will be max 100 concurrent users.
for backend wouldn't it be better to use fastapi?
also need 1 week sprints

user roles: no need for visitor user role
KYC will be needed only for EU assets and not mandatory for registration. mandoatory for trading only

also I need ideas and resources on how to get healines for these topics

need resources to fetch live data for these assets

will deploy at digital ocean for mvp

The readme.md should not be about documetns. this is a project with 3 apps (landing page, the main marketplace app, admin app)

- also don't think i need time series db to store price data. we should get the feed from some provider
- no need for docker atm
- all front ends nextjs. do we need redux in this case? we need to get real time updates at least for the orderbook and the relative parts of the main app

we will host all app at digital ocean

make the necessary changes at all docs
