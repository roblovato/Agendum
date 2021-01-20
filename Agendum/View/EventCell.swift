//
//  EventCell.swift
//  Agendum
//
//  Created by Rob on 1/7/21.
//  Copyright © 2021 Rob Lovato. All rights reserved.
//

import UIKit

class EventCell: UITableViewCell {
    
    @IBOutlet weak var eventBubble: UIView!
    @IBOutlet weak var eventLabel: UILabel!
    @IBOutlet weak var rightImageView: UIImageView!
    @IBOutlet weak var leftImageView: UIImageView!
    
    override func awakeFromNib() {
        super.awakeFromNib()
        eventBubble.layer.cornerRadius = eventBubble.frame.height / 8
    }

    override func setSelected(_ selected: Bool, animated: Bool) {
        super.setSelected(selected, animated: animated)

        // Configure the view for the selected state
    }
    
}
