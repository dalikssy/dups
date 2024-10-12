import Image from "next/image";
import styles from "./Clients.module.css";
import data from "@/data.json";

const Client = ({ clientData, index, client, totalClients, language }) => {
  const renderFollowers = (platform, label) => {
    return clientData[platform] ? (
      <p key={platform}>
        <b>{clientData[platform]}</b> {label}{" "}
        {platform !== "youtube"
          ? data.platforms[language].other
          : data.platforms[language].youtube}
      </p>
    ) : null;
  };

  const getClassName = () => {
    if (index === client) {
      return styles.active;
    } else if (index === (client + 1) % totalClients) {
      return `${styles.channel_opacity} ${styles.channel_top}`;
    } else if (index === (client - 1 + totalClients) % totalClients) {
      return `${styles.channel_opacity} ${styles.channel_bottom}`;
    } else {
      return styles.inactive;
    }
  };

  return (
    <li className={`${styles.channel} ${getClassName()}`}>
      <Image
        src={`/channels/${clientData.image}`}
        width={91}
        height={91}
        alt={clientData.name}
      />
      <div className={styles.channel_info}>
        <h4>{clientData.name}</h4>
        {clientData.description ? (
          <p>{clientData.description[language]}</p>
        ) : (
          <>
            {renderFollowers("tiktok", "Tiktok")}
            {renderFollowers("instagram", "Instagram")}
            {renderFollowers("youtube", "Youtube")}
          </>
        )}
      </div>
    </li>
  );
};

export default Client;
