# Farm-command-center
Farm Command Center - Dairy and Beef Cattle Management App with herd tracking, employee time clock, and farm analytics
// Farm Command Center App (Flutter Scaffold)
// Full integrated starter architecture:
// - Firebase Auth
// - Firestore (farms, users, rooms, messages)
// - Walkie Talkie (real-time chat per farm room)
// - Subscription per FARM (Stripe placeholder service)
// - Employee Dashboard UI
// - Cow Feeding Module
// - Feed Calculator (lbs per cow)

import 'package:flutter/material.dart';
import 'package:cloud_firestore/cloud_firestore.dart';
import 'package:firebase_auth/firebase_auth.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const FarmApp());
}

class FarmApp extends StatelessWidget {
  const FarmApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Farm Command Center',
      theme: ThemeData.dark().copyWith(
        primaryColor: Colors.yellow,
        scaffoldBackgroundColor: const Color(0xFF0E0E0E),
      ),
      home: const AuthGate(),
    );
  }
}

// ===================== AUTH GATE =====================
class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder<User?>(
      stream: FirebaseAuth.instance.authStateChanges(),
      builder: (context, snapshot) {
        if (snapshot.connectionState == ConnectionState.waiting) {
          return const Scaffold(body: Center(child: CircularProgressIndicator()));
        }
        if (!snapshot.hasData) {
          return const LoginPage();
        }
        return const FarmHome();
      },
    );
  }
}

// ===================== LOGIN =====================
class LoginPage extends StatelessWidget {
  const LoginPage({super.key});

  @override
  Widget build(BuildContext context) {
    final emailController = TextEditingController();
    final passController = TextEditingController();

    return Scaffold(
      appBar: AppBar(title: const Text("Farm Login")),
      body: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          children: [
            TextField(controller: emailController, decoration: const InputDecoration(labelText: "Email")),
            TextField(controller: passController, decoration: const InputDecoration(labelText: "Password")),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () async {
                await FirebaseAuth.instance.signInWithEmailAndPassword(
                  email: emailController.text,
                  password: passController.text,
                );
              },
              child: const Text("Login"),
            ),
          ],
        ),
      ),
    );
  }
}

// ===================== HOME DASHBOARD =====================
class FarmHome extends StatefulWidget {
  const FarmHome({super.key});

  @override
  State<FarmHome> createState() => _FarmHomeState();
}

class _FarmHomeState extends State<FarmHome> {
  int index = 0;

  final pages = const [
    EmployeeDashboard(),
    FarmChatRooms(),
    CowFeedingModule(),
    SubscriptionPage(),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: pages[index],
      bottomNavigationBar: BottomNavigationBar(
        currentIndex: index,
        onTap: (i) => setState(() => index = i),
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.dashboard), label: "Dashboard"),
          BottomNavigationBarItem(icon: Icon(Icons.radio), label: "Walkie"),
          BottomNavigationBarItem(icon: Icon(Icons.agriculture), label: "Feeding"),
          BottomNavigationBarItem(icon: Icon(Icons.payment), label: "Billing"),
        ],
      ),
    );
  }
}

// ===================== EMPLOYEE DASHBOARD =====================
class EmployeeDashboard extends StatelessWidget {
  const EmployeeDashboard({super.key});

  @override
  Widget build(BuildContext context) {
    return StreamBuilder(
      stream: FirebaseFirestore.instance.collection('farms').snapshots(),
      builder: (context, snapshot) {
        if (!snapshot.hasData) return const Center(child: CircularProgressIndicator());

        final farms = snapshot.data!.docs;

        return ListView(
          padding: const EdgeInsets.all(12),
          children: [
            const Text("Employee Dashboard", style: TextStyle(fontSize: 22)),
            const SizedBox(height: 10),
            ...farms.map((f) {
              return Card(
                child: ListTile(
                  title: Text(f['name'] ?? 'Farm'),
                  subtitle: Text("Employees: ${(f['employees'] ?? 0)}"),
                ),
              );
            }),
          ],
        );
      },
    );
  }
}

// ===================== WALKIE TALKIE (FARM ROOMS) =====================
class FarmChatRooms extends StatelessWidget {
  const FarmChatRooms({super.key});

  @override
  Widget build(BuildContext context) {
    final roomId = "main_farm_room";

    return Column(
      children: [
        const SizedBox(height: 30),
        const Text("Farm Walkie Talkie", style: TextStyle(fontSize: 20)),
        Expanded(
          child: StreamBuilder<QuerySnapshot>(
            stream: FirebaseFirestore.instance
                .collection('rooms')
                .doc(roomId)
                .collection('messages')
                .orderBy('time')
                .snapshots(),
            builder: (context, snapshot) {
              if (!snapshot.hasData) return const CircularProgressIndicator();

              final msgs = snapshot.data!.docs;

              return ListView(
                children: msgs.map((m) {
                  return ListTile(
                    title: Text(m['text'] ?? ''),
                  );
                }).toList(),
              );
            },
          ),
        ),
        Padding(
          padding: const EdgeInsets.all(8.0),
          child: Row(
            children: [
              Expanded(
                child: TextField(
                  controller: TextEditingController(),
                  decoration: const InputDecoration(hintText: "Send message"),
                  onSubmitted: (val) {
                    FirebaseFirestore.instance
                        .collection('rooms')
                        .doc(roomId)
                        .collection('messages')
                        .add({
                      'text': val,
                      'time': DateTime.now(),
                    });
                  },
                ),
              ),
            ],
          ),
        )
      ],
    );
  }
}

// ===================== COW FEEDING MODULE =====================
class CowFeedingModule extends StatefulWidget {
  const CowFeedingModule({super.key});

  @override
  State<CowFeedingModule> createState() => _CowFeedingModuleState();
}

class _CowFeedingModuleState extends State<CowFeedingModule> {
  final cowsController = TextEditingController();
  final totalFeedController = TextEditingController();

  double result = 0;

  void calculate() {
    final cows = double.tryParse(cowsController.text) ?? 0;
    final feed = double.tryParse(totalFeedController.text) ?? 0;

    setState(() {
      result = cows == 0 ? 0 : feed / cows;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          const Text("Cow Feeding Calculator", style: TextStyle(fontSize: 20)),
          TextField(
            controller: cowsController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: "Number of cows"),
          ),
          TextField(
            controller: totalFeedController,
            keyboardType: TextInputType.number,
            decoration: const InputDecoration(labelText: "Total feed (lbs)"),
          ),
          const SizedBox(height: 10),
          ElevatedButton(onPressed: calculate, child: const Text("Calculate")),
          const SizedBox(height: 20),
          Text("Pounds per cow: \$result"),
        ],
      ),
    );
  }
}

// ===================== SUBSCRIPTION (PER FARM) =====================
class SubscriptionPage extends StatelessWidget {
  const SubscriptionPage({super.key});
  Future<void> subscribeFarm(String farmId) async {
    // Placeholder: pk_live_51TQruB2Kn50p5kDTqzaYXNb1vg7GRSyD694IZ3GszBMGNIrp7HOcPNNhOQECEvZfTPreoe5lXuOYPovtzhBlYvhB00in8Z1JBy 
    await FirebaseFirestore.instance.collection('farms').doc(farmId).update({
      'subscriptionActive': true,
    });
  }

  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Text("Farm Subscription Plan"),
          ElevatedButton(
            onPressed: () => subscribeFarm("farm_001"),
            child: const Text("Activate Farm Subscription"),
          ),
        ],
      ),
    );
  }
}
