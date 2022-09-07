function onObjectEnterZone(zone, object_entering)
  if zone == self then
    object_entering.addTag("RedCard")
    if object_entering.hasTag("BlueCard") then
      object_entering.removeTag("BlueCard")
    end
  end
end

function onObjectLeaveContainer(container, leave_object)
  if container.type == "Deck" then
    leave_object.addTag("RedCard")
  end
end