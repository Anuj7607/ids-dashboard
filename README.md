🛡️ Intelligent Intrusion Detection System (IDS)
A decoupled, full-stack security application that monitors network traffic in real-time and uses Machine Learning to identify potential threats and anomalies.

👥 Team & Contributions
This project was a collaborative effort with a strict separation of concerns between the data engine and the user interface.

Anuj (@Anuj7607): Lead Backend & ML Engineer. Developed the core engine using Python and Scapy for real-time packet sniffing. Implemented the intrusion detection logic and trained Machine Learning model to classify network traffic.

Sneha (@SnehaSaini28): Lead Frontend Engineer. Architected the React-based dashboard and integrated real-time data visualization to monitor and report security alerts. Handled the deployment and hosting on Vercel.

🏗️ System Architecture
The project is built as a decoupled system to ensure scalability and performance:

Packet Sniffing Engine (Python): Uses Scapy to capture live network packets directly from the interface.

ML Inference Pipeline: Processes raw packet data into features and runs them against trained models to detect intrusions.

React Dashboard: A modern UI that consumes security logs and provides a live view of network health.

🚀 Key Features
Real-time Traffic Analysis: Capturing and logging network packets as they happen.

Automated Threat Detection: Utilizing ML models to distinguish between normal traffic and malicious activity.

Decoupled Deployment: Backend logic is separated from the frontend for optimized performance.

🛠️ Tech Stack
Backend: Python, Scapy, Scikit-learn / TensorFlow, Joblib.

Frontend: React.js, Vercel.

Data: CICIDS Dataset.

Note on Repository Contents:
Due to GitHub's file size constraints, large serialized .joblib model files and raw .csv datasets are excluded from this repository via .gitignore. The core logic for training and detection is fully documented in the provided Python scripts.

