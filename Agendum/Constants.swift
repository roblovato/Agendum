//
//  Constants.swift
//  Agendum
//
//  Created by Rob on 1/7/21.
//  Copyright © 2021 Rob Lovato. All rights reserved.
//

struct K {
    static let appName = "Agendum"
    static let registerSegue = "RegisterStart"
    static let loginSegue = "LoginStart"
    static let cellNibName = "EventCell"
    
    static let cellId = "ReusableCell"
    
    struct BrandColors {
        static let brandDark = "BrandDark"
    }
    
    struct FStore {
        static let collectionName = "events"
        static let senderField = "sender"
        static let bodyField = "body"
        static let dateField = "date"
    }
}
