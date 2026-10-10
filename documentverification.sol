
 // SPDX-License-Identifier: MIT
 pragma solidity ^0.8.20;

 contract DocumentVerification {
     struct Document {
         string cid;
         bytes32 fileHash;
         address uploader;
         uint256 timestamp;
         bool exists;
     }

     mapping(bytes32 => Document) private documents;

     event DocumentRegistered(
         bytes32 indexed fileHash,
         string cid,
         address indexed uploader
     );

     function registerDocument(
         string calldata _cid,
         bytes32 _fileHash
     ) external {
         require(bytes(_cid).length > 0, "CID cannot be empty");
         require(_fileHash != bytes32(0), "Invalid file hash");
         require(!documents[_fileHash].exists, "Already registered");

         documents[_fileHash] = Document({
             cid: _cid,
             fileHash: _fileHash,
             uploader: msg.sender,
             timestamp: block.timestamp,
             exists: true
         });

         emit DocumentRegistered(_fileHash, _cid, msg.sender);
     }

     function getDocument(
         bytes32 _fileHash
     )
         external
         view
         returns (
             string memory cid,
             address uploader,
             uint256 timestamp,
             bool exists
         )
     {
         Document storage doc = documents[_fileHash];

         return (
             doc.cid,
             doc.uploader,
             doc.timestamp,
             doc.exists
         );
     }

     function verifyDocument(
         bytes32 _fileHash
     ) external view returns (bool) {
         return documents[_fileHash].exists;
     }
 }


//bafkreiensn45n2flc3t5coyyqa3vt3zrh3pjw6fdwjuooizk6wxj6ti4hu

//0x8D9379D6E8AB16E7D13B18803759EF313EDE9B78A3B268E7232AF5AE9F4D1C3D