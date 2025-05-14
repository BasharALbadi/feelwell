import React, { useState, useEffect } from "react";

const OPENCAGE_API_KEY = "126732241cab406e9d77de192b68807a"; // Get it at https://opencagedata.com
const Location = () => {
  const [location, setLocation] = useState(null);
  const [placeInfo, setPlaceInfo] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude, accuracy } = position.coords;
          setLocation({ latitude, longitude, accuracy });
          try {
            const response = await fetch(
              `https://api.opencagedata.com/geocode/v1/json?q=${latitude}+${longitude}&key=${OPENCAGE_API_KEY}`
            );
            const data = await response.json();
            if (data && data.results.length > 0) {
              const components = data.results[0].components;
              setPlaceInfo({
                city: components.city || components.town || components.village,
                region: components.state,
                country: components.country,
                accuracy: components.accuracy,
              });
            } else {
              setError("Could not retrieve location details.");
            }
          } catch (err) {
            setError("Failed to fetch reverse geolocation.");
          }
        },
        (err) => {
          setError("Permission denied or location unavailable");
        }
      );
    } else {
      setError("Geolocation not supported by your browser");
    }
  }, []);

  return (
    <div>
      <h1>Current Location & Place Info</h1>
      {error && <p>{error}</p>}
      {location ? (
        <>
          <p>
            <strong>Latitude:</strong> {location.latitude}
          </p>
          <p>
            <strong>Longitude:</strong> {location.longitude}
          </p>
          <p>
            <strong>Accuracy:</strong> {location.accuracy} meters
          </p>
        </>
      ) : (
        !error && <p>Getting location...</p>
      )}
      {placeInfo && (
        <div style={{ marginTop: "1rem" }}>
          <p>
            <strong>City:</strong> {placeInfo.city}
          </p>
          <p>
            <strong>Region:</strong> {placeInfo.region}
          </p>
          <p>
            <strong>Country:</strong> {placeInfo.country}
          </p>
        </div>
      )}
    </div>
  );
};

export default Location;
