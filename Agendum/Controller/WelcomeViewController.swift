//
//  ViewController.swift
//  Agendum
//
//  Created by Rob on 12/1/20.
//  Copyright © 2020 Rob Lovato. All rights reserved.
//

import UIKit

class WelcomeViewController: UIViewController {
    
    override func viewWillAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        navigationController?.isNavigationBarHidden = true
    }
    
    override func viewWillDisappear(_ animated: Bool) {
        super.viewWillDisappear(animated)
        navigationController?.isNavigationBarHidden = false
    }

    override func viewDidLoad() {
        super.viewDidLoad()
        // Do any additional setup after loading the view.
    }

    @IBAction func logInPressed(_ sender: UIButton) {
        print("Log In")
    }
    
    
    @IBAction func registerPressed(_ sender: UIButton) {
        print("Register")
    }
    
}

