<?xml version="1.0" encoding="UTF-8"?>
<tileset version="1.10" tiledversion="1.11.2" name="airport-dev" tilewidth="32" tileheight="32" tilecount="25" columns="5">
 <image source="v3.png" width="160" height="160"/>
 <tile id="4">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="5">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="6">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="7">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="8">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="9">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="10">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="11">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="12">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="13">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="14">
  <properties>
   <property name="collides" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="15">
  <properties>
   <property name="code" value="body_scanner"/>
   <property name="collides" type="bool" value="true"/>
   <property name="passengerInteractions" value="enterBodyScanner"/>
   <property name="passengerInteractive" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="16">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="name" value="bag_scanner"/>
   <property name="passengerInteractions" value=""/>
   <property name="passengerInteractive" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="17">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="name" value="bag_drop_bag_bay"/>
   <property name="passengerInteractions" value=""/>
   <property name="passengerInteractive" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="18">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="name" value="bag_pickup"/>
   <property name="passengerInteractions" value="collectBag,lookForBag"/>
   <property name="passengerInteractive" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="19">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="name" value="bag_conveyor"/>
   <property name="passengerInteractions" value=""/>
   <property name="passengerInteractive" type="bool" value="false"/>
  </properties>
 </tile>
 <tile id="21">
  <properties>
   <property name="collides" type="bool" value="true"/>
   <property name="name" value=""/>
   <property name="passengerInteractions" value=""/>
   <property name="passengerInteractive" type="bool" value="true"/>
  </properties>
 </tile>
 <tile id="22">
  <properties>
   <property name="name" value="bag_drop_passenger_bay"/>
   <property name="passengerInteractions" value="unloadBag"/>
   <property name="passengerInteractive" type="bool" value="true"/>
  </properties>
 </tile>
</tileset>
