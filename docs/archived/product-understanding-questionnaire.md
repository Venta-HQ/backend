# 🎯 **Venta Product Understanding Questionnaire**

## **Purpose**

This questionnaire helps understand your product to create a proper Domain-Driven Design (DDD) migration guide that reflects your actual business domains and processes.

---

## **1. Product Overview**

### **What is Venta?**

**What type of marketplace/platform is Venta?**
Venta is an app that services two groups of people: mobile vendors and average consumers.
Vendors will be able to put themselves on a map using geolocation and users can see where they are in real time.
This allows for users to easily find vendors nearby. This is an oversimplification of course, there are more features for vendors
and users. For example users will be able to search for vendors and view their details.
Vendors will have different access depending on their subscription level that might affect how their map access works.

**What industry/vertical does it serve?**
Mobile Vendors, primarily food vendors at first

**Who are the primary users/customers?**
Average people who want to find local vendors to buy food from.

**What problem does Venta solve?**
Venta gives every mobile vendor the ability to easily become visible to people they would not otherwise be able to.

### **Business Model**

**How does Venta make money?**
Venta will make money in multiple ways:

1. Subscriptions from vendors for more advanced features and real-time capability
2. Eventually we will allow users to pay for things via the app and we will take a cut
3. Advertising

**What are the main revenue streams?**
I imagine the main revenue will come from subscriptions and cuts of transactions via Stripe

**Who pays for the service (customers, vendors, both)?**
Only the Vendors pay, and even they can use the app free with very minimal feature sets.

---

## **2. User Types & Roles**

### **Customer/End Users**

**What do customers use Venta for?**
Find local vendors

**What actions can customers perform?**

- view the vendor map that shows nearby active vendors
- search for vendors in a more traditional way
- review vendors
- favorite vendors
- sign in/out

There are more features to come but these are what are in my mind right now. Some of these are implemented some not.

**What information do customers provide?**
Customer need to log in via Clerk so they are authenticating with Clerk. Aside from that, average users will mostly just be providing their location.

**How do customers discover vendors/services?**

- A real-time map
- A search section where they can instead search for vendors via Algolia

### **Vendors/Business Users**

**What types of businesses can be vendors?**
Any type! There are even plans to eventually allow event organizers and static businesses (actual building-based businesses) to use Venta to post events and do location-based adveritising.

**What do vendors use Venta for?**
Gaining visibility with potential customers

**What actions can vendors perform?**

- make themselves visible on a map
- manage their profile
- log in / out
- manage subscription

There are more features to come but these are what are in my mind right now. Some of these are implemented some not.

**What information do vendors provide?**
Vendors will be providing their location and whatever information they want to put in their profile.

### **Other User Types**

**Are there any other user types (admins, moderators, etc.)?**
At the beginning no, but we plan for more.

**What are their roles and permissions?**
N/A

---

## **3. Core Business Processes**

### **Customer Journey**

**How does a customer typically use Venta?**
They would open the app, log in if they aren't already, and be presented with a map indicating vendors who are currently set to active (they have indicated they available)

**What are the main steps in the customer journey?**

1. Log In
2. View map
3. (optional) Click an indicator on the app to view a vendor's details

**What decisions do customers make?**
From a user perspective this is actually very simple. View a map, maybe click a vendor. Upon first opening the app they will be asked to turn location sharing on on the client-side.

### **Vendor Journey**

**How does a vendor typically use Venta?**
They would log in, set themselves to active. Right now real-time is the default but we plan to only allow a vendor to update their pin on the map once every hour unless they are a paid subscriber. Then they can turn it on and they will be updated in real-time on the map until they turn it off.

**What are the main steps in the vendor journey?**

1. Log in
2. Be presented with their vendor home page that shows their information
3. Turn their location on so they are present on the app
4. Turn it off when they are done

**What decisions do vendors make?**

1. Whether or not to turn their location on/off

### **Interaction Between Users**

**How do customers and vendors interact?**
In the current iteration of the app they won't interact aside from the fact that users will be able to leave reviews

**What types of transactions occur?**
At the moment, nothing via the app. Eventually vendors can give users the ability to pay for goods via the app

**What communication happens between parties?**
None in the app at the moment

---

## **4. Location & Geography**

### **Location Importance**

**How important is location in your business?**
Extremely, being able to find vendors is the major value of the app

**What role does proximity play?**
Proximity is important because it allows us to show users nearby vendors

**How do you handle location-based services?**
We use mobile geolocation libraries and websockets to maintain a redis geolocation store of locations to run geoqueries against to show nearby vendors.

### **Geographic Scope**

**What geographic areas do you serve?**
None at the moment, stillbuilding it.

**How do you handle different regions/locations?**
Not relevant at the moment.

**Are there location-specific business rules?**
None at the moment

---

## **5. Business Rules & Validations**

### **Customer Rules**

**What are the requirements for customer accounts?**
They authenticate via Clerk using Clerk's requirements

**What validations apply to customer data?**
Clerk

**What are the age/eligibility requirements?**
None

### **Vendor Rules**

**What are the requirements for vendor accounts?**
Same as uer

**What validations apply to vendor data?**
Same as user

**What approval/verification processes exist?**
Same as user

### **Business Logic**

**What are the key business rules?**
Paid vs. Free features
User vs. Vendor features

**What are the validation requirements?**
Unsure

**What are the approval workflows?**
Unsure

---

## **6. Key Business Events**

### **Customer Events**

**What important events happen with customers?**
Location changes

**What triggers these events?**
Moving

**What data is associated with each event?**
Long/Lat/UserId

### **Vendor Events**

**What important events happen with vendors?**
Goes live
Change location

**What triggers these events?**
Manual interactions in the app or moving

**What data is associated with each event?**
It depends on the event

### **Interaction Events**

**What events occur when customers and vendors interact?**
N/A

**What triggers these events?**
N/A

**What data is associated with each event?**
N/A

---

## **7. Data & Information**

### **Customer Data**

**What information do you collect about customers?**
Location

**What are the key customer attributes?**
Location

**How do you handle customer preferences?**
These are store in the database

### **Vendor Data**

**What information do you collect about vendors?**
Profile information
Preferences
Location
Subscription Status

**What are the key vendor attributes?**
All of it is important

**How do you handle vendor services/offerings?**
These are stored in the database

### **Transaction Data**

**What data do you track about interactions?**
N/A

**What are the key transaction attributes?**
N/A

**How do you handle payment/billing information?**
N/A

---

## **8. Search & Discovery**

### **Search Functionality**

**How do customers find vendors?**
They see them on the map, which is populated via a redis geolocation search on vendor data based on their location
They can also search via Algolia off of the map

**What search criteria are important?**
Current Location
Vendor Name

**How do you handle search results?**
Right now we just return the full list of matching criteria

### **Recommendations**

**Do you provide recommendations?**
No, but may in the future

**How do you determine recommendations?**
N/A

**What factors influence recommendations?**
N/A

---

## **9. Real-time Features**

### **Live Updates**

**What real-time features do you have?**
The map

**What triggers real-time updates?**
Vendor location updatesx

**How do you handle live location updates?**
These are sent via webhook to the webhook gateway and the user ends up getting sent an event with updated locations of the vendor via a room

### **Communication**

**How do users communicate in real-time?**
N/A

**What types of messages are sent?**
N/A

**How do you handle notifications?**
N/A

---

## **10. Business Metrics & Analytics**

### **Key Metrics**

**What are the most important business metrics?**
Unknown at the moment

**How do you measure success?**
Unknown at the moment

**What data do you track for analytics?**
Unknown at the moment

### **Reporting**

**What reports do you generate?**
N/A

**Who uses these reports?**
N/A

**What insights are most valuable?**
N/A

---

## **11. Technical Context**

### **Current Architecture**

**What are the main technical challenges?**
It is a pretty simple app, but maintaining solid connections is important

**What are the performance requirements?**
The app should feel smooth and quick

**What are the scalability needs?**
I expect various domains to be able to scale independently. The real-time related services will be under more load than others most likely

### **Integration Points**

**What external systems do you integrate with?**
None

**What APIs do you expose?**
None

**What third-party services do you use?**
RevenueCat, Clerk, Algolia, Postgres, all of our monitoring stuff

---

## **12. Future Vision**

### **Growth Plans**

**What are your growth plans?**
A lot of the features I mentioned above are not yet implemented but planned. We plan to add a lot more features for vendors to be able to monitor their success, improve their visibility, etc...

**What new features are planned?**

- Reporting
- Reviews
- Favorite Vendors
- Analytics
- In-App payments for vendor goods
- Loyalty programs
- Location-based notifications

**What new user types might you add?**

- Event organizers

### **Business Expansion**

**What new markets/regions are you targeting?**

- Event organizers
- Static-location businesses

**What new business models are you considering?**

- Allowing business with permanent locations to set up location-based events that trigger when users get in that locaiton. For example a user walking past their store might get a notification with a coupon/menu/deal for that place

**What partnerships are important?**
Unknown

---

## **Instructions for Answering**

1. **Answer each question** with as much detail as possible
2. **Provide specific examples** where helpful
3. **Focus on business processes** rather than technical implementation
4. **Include context** about why certain decisions were made
5. **Be honest about current state** - we can improve what we understand

## **What I'll Do With This Information**

Once you provide this information, I'll:

1. **Update the DDD migration guide** with proper domain events that reflect your actual business
2. **Create domain-specific schemas** that match your business processes
3. **Design bounded contexts** based on your real business domains
4. **Implement domain services** with your actual business logic
5. **Create proper domain events** that capture your business processes

This will ensure the DDD migration is meaningful and aligned with your actual business needs! 🚀
