//
//  CalendarHomeViewController.swift
//  Agendum
//
//  Created by Rob on 12/22/20.
//  Copyright © 2020 Rob Lovato. All rights reserved.
//

import UIKit
import Firebase

class CalendarHomeViewController: UIViewController {
    
    @IBOutlet weak var tableView: UITableView!
    @IBOutlet weak var messageTextField: UITextField!
    
    let db = Firestore.firestore()
    
    var events: [Event] = []
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        tableView.delegate = self
        tableView.dataSource = self
        title = "Calendar"
        navigationItem.hidesBackButton = true
        
        //register EventCell.xib
        tableView.register(UINib(nibName: K.cellNibName, bundle: nil), forCellReuseIdentifier: K.cellId)
        
        loadMessages()
    }
    
    func loadMessages() {
        db.collection(K.FStore.collectionName)
            .order(by: K.FStore.dateField)
            .addSnapshotListener { (querySnapshot, error) in
            
            self.events = []
            
            if let e = error {
                print("Error getting data from Firestore \(e)")
            } else {
                if let snapshotDocuments = querySnapshot?.documents {
                    for doc in snapshotDocuments {
                        let data = doc.data()
                        if let messageSender = data[K.FStore.senderField] as? String, let messageBody = data[K.FStore.bodyField] as? String {
                            let newEvent = Event(title: messageSender, date: messageBody, sender: messageSender)
                            self.events.append(newEvent)
                            
                            DispatchQueue.main.async {
                                self.tableView.reloadData()
                                
                                //scroll the tableView
                                let indexPath = IndexPath(row: self.events.count - 1, section: 0)
                                self.tableView.scrollToRow(at: indexPath, at: .top, animated: true)
                            }
                        }
                    }
                }
                
                print("Success")
            }
        }
    }
    
    @IBAction func logOutPressed(_ sender: UIBarButtonItem) {
        do {
          try Auth.auth().signOut()
            navigationController?.popToRootViewController(animated: true)
        } catch let signOutError as NSError {
          print ("Error signing out: %@", signOutError)
        }
          
    }
    
    @IBAction func homePressed(_ sender: UIButton) {
        print("Home")
    }
    
    
    @IBAction func calendarsPressed(_ sender: UIButton) {
        print("Calendars")
    }
    
    
    @IBAction func sendPressed(_ sender: UIButton) {
        if let messageBody = messageTextField.text, let messageSender = Auth.auth().currentUser?.email {
            //add items to database
            db.collection(K.FStore.collectionName).addDocument(data: [
                K.FStore.senderField: messageSender,
                K.FStore.bodyField: messageBody,
                K.FStore.dateField: Date().timeIntervalSince1970
            ]) { (error) in
                if let e = error {
                    print("There was a problem saving to firestore, \(e)")
                } else {
                    print("Successfull save")
                    
                    //because once inside a closure, and updating UI, need to tap into this so it stays on the main thread instead of background thread
                    DispatchQueue.main.async {
                        self.messageTextField.text = ""
                    }
                }
            }
        }
    }
}

extension CalendarHomeViewController: UITableViewDataSource {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        return events.count
    }
    
    //gets called as many times as there are cells (events.count)
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        let event = events[indexPath.row]
        
        let cell = tableView.dequeueReusableCell(withIdentifier: K.cellId, for: indexPath)
            as! EventCell
        cell.eventLabel.text = event.date
        
        //This is event from current user
        if event.sender == Auth.auth().currentUser?.email {
            cell.leftImageView.isHidden = true
            cell.rightImageView.isHidden = false
            cell.eventBubble.backgroundColor = UIColor(named: K.BrandColors.brandDark)
//            cell.eventLabel.textColor = UIColor(named: K.BrandColors.brandDark)
        } else {
            cell.leftImageView.isHidden = false
            cell.rightImageView.isHidden = true
        }
        
        return cell
    }
    
    
}

extension CalendarHomeViewController: UITableViewDelegate {
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        print(indexPath.row)
        // executed on row touch
    }
}
