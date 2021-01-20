//
//  LogInViewController.swift
//  Agendum
//
//  Created by Rob on 12/22/20.
//  Copyright © 2020 Rob Lovato. All rights reserved.
//

import UIKit
import Firebase

class LogInViewController: UIViewController {

    @IBOutlet weak var loginEmail: UITextField!
    @IBOutlet weak var loginPassword: UITextField!
    
    override func viewDidLoad() {
        super.viewDidLoad()
        
        title = K.appName
    }
    

    @IBAction func loginPressed(_ sender: UIButton) {
        if let email = loginEmail.text, let password = loginPassword.text {
            Auth.auth().signIn(withEmail: email, password: password) { authResult, error in
                if let e = error {
                    print(e)
                } else {
                    self.performSegue(withIdentifier: K.loginSegue, sender: self)
                }
            }
        }
    }

}
