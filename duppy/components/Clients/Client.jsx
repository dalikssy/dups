import Image from "next/image";
import styles from "./Clients.module.css";
import data from "@/data.json";

const Client = ({ clientData, index, language }) => {
  const renderFollowers = (platform, label) => {
    return clientData[platform] ? (
      <p key={platform}>
        <b>{clientData[platform]}</b> {label}{" "}
        {platform !== "youtube" ? data.platforms[language].other : data.platforms[language].youtube}
      </p>
    ) : null;
  };

  return (
    <div className={`${styles.channel} ${index % 2 ? styles.alt : ""}`} data-tilt>
      <Image src={`/channels/${clientData.image}`} width={84} height={84} alt={clientData.name} />
      <div className={styles.channel_info}>
        <h4 data-scramble>{clientData.name}</h4>
        {clientData.description ? (
          <p>{clientData.description[language]}</p>
        ) : (
          <>
            {renderFollowers("tiktok", "TikTok")}
            {renderFollowers("instagram", "Instagram")}
            {renderFollowers("youtube", "YouTube")}
          </>
        )}
      </div>
    </div>
  );
};

export default Client;
